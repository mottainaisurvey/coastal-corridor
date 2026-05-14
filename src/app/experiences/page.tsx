'use client';

/**
 * /experiences — CC-D-01-A AC-3
 *
 * Guest-facing experience listing page.
 *
 * Features:
 *   - Three filter controls: destination (text), type (dropdown), date (date picker)
 *   - Filter state in URL search params for shareability
 *   - Responsive grid: 1 col (mobile) / 2 col (tablet) / 3 col (desktop)
 *   - Experience cards: primary image, name, location, price-from, duration
 *   - Server-side pagination: 12 per page with Previous/Next/page number controls
 *   - Empty state, loading state, error state
 *   - Public — no auth required
 */

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, Filter, Calendar, MapPin, Clock, Users, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Compass } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceSummary {
  id:                     string;
  name:                   string;
  description:            string;
  experienceType:         string;
  durationMinutes:        number;
  capacity:               number;
  location:               string;
  priceFrom:              number;
  currency:               string;
  pricingModel:           string;
  primaryImage:           string | null;
  operatorDisplayName:    string | null;
}

interface Pagination {
  page:       number;
  perPage:    number;
  totalCount: number;
  totalPages: number;
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; experiences: ExperienceSummary[]; pagination: Pagination };

// ── Constants ─────────────────────────────────────────────────────────────────

const EXPERIENCE_TYPES: { value: string; label: string }[] = [
  { value: '',               label: 'All types'         },
  { value: 'TOUR',           label: 'Tour'              },
  { value: 'CHARTER',        label: 'Charter'           },
  { value: 'WORKSHOP',       label: 'Workshop'          },
  { value: 'FOOD_EXPERIENCE', label: 'Food Experience'  },
  { value: 'TRANSPORT',      label: 'Transport'         },
  { value: 'EVENT_SPECIALIST', label: 'Event Specialist' },
  { value: 'WELLNESS',       label: 'Wellness'          },
  { value: 'OTHER',          label: 'Other'             },
];

const CORRIDOR_DESTINATIONS = [
  '', 'Lagos', 'Lekki', 'Epe', 'Ibeju-Lekki', 'Badagry',
  'Ogun Waterside', 'Ondo', 'Edo', 'Delta', 'Bayelsa',
  'Rivers', 'Akwa Ibom', 'Cross River', 'Calabar',
];

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style:    'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function typeLabel(type: string): string {
  return EXPERIENCE_TYPES.find(t => t.value === type)?.label ?? type;
}

// ── ExperienceCard ────────────────────────────────────────────────────────────

function ExperienceCard({ exp }: { exp: ExperienceSummary }) {
  return (
    <Link href={`/experiences/${exp.id}`} className="group block bg-white border border-ink/10 rounded-lg overflow-hidden hover:shadow-md hover:border-ocean/30 transition-all duration-200">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-ink/5 overflow-hidden">
        {exp.primaryImage ? (
          <img
            src={exp.primaryImage}
            alt={exp.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ocean/10 to-ocean/5">
            <div className="text-center">
              <Compass className="w-8 h-8 text-ocean/40 mx-auto mb-1" />
              <span className="text-[11px] text-ink/30 font-mono uppercase tracking-widest">
                {exp.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className="text-[10px] font-mono uppercase tracking-widest bg-white/90 text-ocean px-2 py-0.5 rounded">
            {typeLabel(exp.experienceType)}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <h3 className="font-serif text-[17px] font-medium leading-snug mb-1 group-hover:text-ocean transition-colors line-clamp-2">
          {exp.name}
        </h3>
        <div className="flex items-center gap-1 text-[12px] text-ink/50 mb-2">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{exp.location}</span>
        </div>
        <p className="text-[13px] text-ink/60 leading-relaxed line-clamp-2 mb-3">
          {exp.description}
        </p>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-ink/40 uppercase tracking-widest">From</div>
            <div className="font-serif text-[18px] font-medium text-ink">
              {formatCurrency(exp.priceFrom, exp.currency)}
            </div>
            <div className="text-[10px] text-ink/40">
              {exp.pricingModel === 'PER_PERSON' ? 'per person' : exp.pricingModel === 'PER_GROUP' ? 'per group' : ''}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[12px] text-ink/50 justify-end">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(exp.durationMinutes)}</span>
            </div>
            <div className="flex items-center gap-1 text-[12px] text-ink/50 justify-end mt-0.5">
              <Users className="w-3 h-3" />
              <span>Up to {exp.capacity}</span>
            </div>
          </div>
        </div>
        {exp.operatorDisplayName && (
          <div className="mt-2 pt-2 border-t border-ink/5 text-[11px] text-ink/40">
            by {exp.operatorDisplayName}
          </div>
        )}
      </div>
    </Link>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────

function PaginationControls({ pagination, onPageChange }: { pagination: Pagination; onPageChange: (p: number) => void }) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1;
    if (page <= 3) return i + 1;
    if (page >= totalPages - 2) return totalPages - 4 + i;
    return page - 2 + i;
  });

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 text-[13px] border border-ink/15 rounded-md hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />Previous
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 text-[13px] rounded-md border transition-colors ${
            p === page
              ? 'bg-ocean text-white border-ocean'
              : 'border-ink/15 hover:bg-ink/5'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-[13px] border border-ink/15 rounded-md hover:bg-ink/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        Next<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function ExperiencesPageInner() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [destination, setDestination] = useState(searchParams.get('destination') ?? '');
  const [type,        setType]        = useState(searchParams.get('type') ?? '');
  const [date,        setDate]        = useState(searchParams.get('date') ?? '');
  const [page,        setPage]        = useState(parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const [pageState,   setPageState]   = useState<PageState>({ status: 'loading' });

  const buildUrl = useCallback((overrides: Record<string, string | number> = {}) => {
    const params = new URLSearchParams();
    const d   = (overrides.destination ?? destination) as string;
    const t   = (overrides.type ?? type) as string;
    const dt  = (overrides.date ?? date) as string;
    const pg  = (overrides.page ?? page) as number;
    if (d)  params.set('destination', d);
    if (t)  params.set('type', t);
    if (dt) params.set('date', dt);
    if (pg > 1) params.set('page', String(pg));
    return `/experiences${params.toString() ? '?' + params.toString() : ''}`;
  }, [destination, type, date, page]);

  const fetchExperiences = useCallback((pg: number) => {
    setPageState({ status: 'loading' });
    const params = new URLSearchParams();
    if (destination) params.set('destination', destination);
    if (type)        params.set('type', type);
    if (date)        params.set('date', date);
    params.set('page', String(pg));
    params.set('perPage', '12');

    fetch(`/api/experiences?${params.toString()}`)
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => setPageState({ status: 'ok', experiences: data.experiences, pagination: data.pagination }))
      .catch(err => {
        console.error('[experiences] fetch error:', err);
        setPageState({ status: 'error', message: 'Unable to load experiences — please try again.' });
      });
  }, [destination, type, date]);

  useEffect(() => {
    fetchExperiences(page);
  }, [fetchExperiences, page]);

  const handleFilter = () => {
    setPage(1);
    router.push(buildUrl({ page: 1 }), { scroll: false });
    fetchExperiences(1);
  };

  const handleClearFilters = () => {
    setDestination('');
    setType('');
    setDate('');
    setPage(1);
    router.push('/experiences', { scroll: false });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    router.push(buildUrl({ page: p }), { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasFilters = destination || type || date;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-ink text-paper py-16 md:py-20">
        <div className="container-x">
          <div className="eyebrow-on-dark mb-4">Experiences · Coastal Corridor</div>
          <h1 className="font-serif text-[40px] md:text-[56px] leading-[1.05] tracking-tightest font-light max-w-3xl mb-4">
            Discover the corridor.
            <span className="italic text-ocean-2 block">Book an experience.</span>
          </h1>
          <p className="text-[16px] md:text-[18px] text-paper/70 leading-relaxed max-w-xl font-light">
            Tours, charters, workshops, and cultural experiences along the 245km Lagos–Calabar coastal highway.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="border-b border-ink/10 bg-white sticky top-0 z-10 shadow-sm">
        <div className="container-x py-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            {/* Destination */}
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Destination</label>
              <div className="relative">
                <select
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full appearance-none bg-white border border-ink/20 rounded-md px-3 py-2 pr-8 text-[13px] text-ink focus:outline-none focus:border-ocean/50"
                >
                  <option value="">All destinations</option>
                  {CORRIDOR_DESTINATIONS.filter(Boolean).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <MapPin className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30 pointer-events-none" />
              </div>
            </div>

            {/* Type */}
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Type</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full appearance-none bg-white border border-ink/20 rounded-md px-3 py-2 pr-8 text-[13px] text-ink focus:outline-none focus:border-ocean/50"
                >
                  {EXPERIENCE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30 pointer-events-none" />
              </div>
            </div>

            {/* Date */}
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono uppercase tracking-widest text-ink/40 mb-1">Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-white border border-ink/20 rounded-md px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ocean/50"
                />
                <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/30 pointer-events-none" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleFilter}
                className="flex items-center gap-2 px-4 py-2 bg-ocean text-white rounded-md text-[13px] hover:bg-ocean/90 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />Search
              </button>
              {hasFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 border border-ink/20 rounded-md text-[13px] text-ink/60 hover:bg-ink/5 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="container-x py-10">
        {/* Loading skeleton */}
        {pageState.status === 'loading' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-ink/10 rounded-lg overflow-hidden">
                <div className="aspect-[4/3] bg-ink/5" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-ink/5 rounded w-3/4" />
                  <div className="h-3 bg-ink/5 rounded w-1/2" />
                  <div className="h-3 bg-ink/5 rounded w-full" />
                  <div className="h-3 bg-ink/5 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {pageState.status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <p className="text-ink/60">{pageState.message}</p>
            <button
              onClick={() => fetchExperiences(page)}
              className="flex items-center gap-2 px-4 py-2 border border-ink/20 rounded-md text-[13px] hover:bg-ink/5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />Try again
            </button>
          </div>
        )}

        {/* Results */}
        {pageState.status === 'ok' && (
          <>
            {/* Result count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-[13px] text-ink/50">
                {pageState.pagination.totalCount === 0
                  ? 'No experiences found'
                  : `${pageState.pagination.totalCount} experience${pageState.pagination.totalCount !== 1 ? 's' : ''}`}
                {hasFilters && ' matching your filters'}
              </p>
            </div>

            {/* Empty state */}
            {pageState.experiences.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-20 text-center max-w-md mx-auto">
                <Compass className="w-12 h-12 text-ocean/30" />
                <h2 className="font-serif text-[22px] font-light">No experiences match your search</h2>
                <p className="text-[14px] text-ink/50 leading-relaxed">
                  Try adjusting your filters or browse all corridor experiences.
                </p>
                <Link
                  href="/experiences"
                  onClick={handleClearFilters}
                  className="px-4 py-2 bg-ocean text-white rounded-md text-[13px] hover:bg-ocean/90 transition-colors"
                >
                  Browse all experiences
                </Link>
              </div>
            )}

            {/* Grid */}
            {pageState.experiences.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageState.experiences.map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} />
                ))}
              </div>
            )}

            {/* Pagination */}
            <PaginationControls
              pagination={pageState.pagination}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </section>
    </div>
  );
}

// Wrap in Suspense so useSearchParams() satisfies Next.js 14 static-render requirements
export default function ExperiencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600" /></div>}>
      <ExperiencesPageInner />
    </Suspense>
  );
}
