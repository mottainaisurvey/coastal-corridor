'use client';

/**
 * /operator/experiences — CC-C-09-C-1 AC-1c
 *
 * Read-only list view of the operator's Experience records.
 * Cards show: name, status badge, type badge, location, duration/capacity,
 * price, and primary image if available.
 *
 * Empty state: "No experiences listed yet — experiences you list on Owambe
 *   Experiences will appear here when syndicated through CC."
 *
 * Sort: ACTIVE first, then UNDER_REVIEW, then INACTIVE. Newest-first within group.
 * Loading/error states mirror CC-C-09-B dashboard pattern.
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, BarChart3, Star, Calendar, FileText, Settings, LogOut, RefreshCw, MapPin, Clock, Users } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface ExperienceItem {
  id:                      string;
  owambeExperienceId:      string;
  name:                    string;
  status:                  string;
  experienceType:          string;
  durationMinutes:         number;
  capacity:                number;
  pricingModel:            string;
  basePrice:               number;
  baseCurrency:            string;
  meetingPointDescription: string;
  ageRestriction:          string | null;
  weatherDependent:        boolean;
  verificationLevel:       string | null;
  createdAt:               string;
  primaryImage:            { url: string; caption: string | null } | null;
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; experiences: ExperienceItem[] };

const STATUS_LABELS: Record<string, string> = {
  ACTIVE:       'Active',
  UNDER_REVIEW: 'Under Review',
  INACTIVE:     'Inactive',
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE:       'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  UNDER_REVIEW: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  INACTIVE:     'text-paper/40 bg-paper/5 border-paper/10',
};
const TYPE_LABELS: Record<string, string> = {
  TOUR:             'Tour',
  CHARTER:          'Charter',
  WORKSHOP:         'Workshop',
  FOOD_EXPERIENCE:  'Food',
  TRANSPORT:        'Transport',
  EVENT_SPECIALIST: 'Event',
  WELLNESS:         'Wellness',
  OTHER:            'Other',
};

function formatPrice(amount: number, currency: string, model: string): string {
  const symbol = currency === 'NGN' ? '₦' : currency + ' ';
  const formatted = symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const suffix = model === 'PER_PERSON' ? '/person' : model === 'PER_GROUP' ? '/group' : '';
  return formatted + suffix;
}

function OperatorSidebar({ active, user }: { active: string; user: any }) {
  const navItems = [
    { icon: BarChart3, label: 'Dashboard',   href: '/operator/dashboard'   },
    { icon: Star,      label: 'Experiences', href: '/operator/experiences' },
    { icon: Calendar,  label: 'Bookings',    href: '/operator/bookings'    },
    { icon: FileText,  label: 'Revenue',     href: '/operator/revenue'     },
    { icon: Settings,  label: 'Settings',    href: '/operator/settings'    },
  ];
  return (
    <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col">
      <div className="p-6 border-b border-paper/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="font-serif text-[15px] font-light">Coastal Corridor</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40 mt-0.5">Operator Portal</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
              active === label
                ? 'bg-gold/10 text-gold border border-gold/20'
                : 'text-paper/60 hover:text-paper hover:bg-paper/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-paper/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-gold text-[11px] font-mono">{user?.firstName?.[0] || 'O'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user?.fullName || 'Operator'}</div>
            <div className="text-[11px] text-paper/40 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
        <Link href="/operator/sign-in" className="flex items-center gap-2 px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}

export default function OperatorExperiencesPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });

  const isOperator = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['OPERATOR', 'operator', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isOperator) router.replace('/operator/sign-in');
  }, [isLoaded, isOperator, router]);

  const fetchExperiences = () => {
    setPageState({ status: 'loading' });
    fetch('/api/operator/experiences')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => setPageState({ status: 'ok', experiences: data.experiences }))
      .catch(err => {
        console.error('[operator/experiences] fetch error:', err);
        setPageState({ status: 'error', message: 'Unable to load experiences — please refresh.' });
      });
  };

  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetchExperiences();
  }, [isLoaded, isOperator]);

  if (!isLoaded || !isOperator) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/20" />
          <div className="h-4 w-32 rounded bg-paper/10" />
        </div>
      </div>
    );
  }

  const experiences = pageState.status === 'ok' ? pageState.experiences : [];

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <OperatorSidebar active="Experiences" user={user} />

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Portal</div>
            <h1 className="font-serif text-3xl font-light">Experiences</h1>
            <p className="text-paper/50 text-[14px] mt-1">Your experiences listed through Coastal Corridor.</p>
          </div>

          {/* Error banner */}
          {pageState.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{pageState.message}</span>
              <button onClick={fetchExperiences} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {pageState.status === 'loading' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-ink border border-paper/10 rounded-lg p-5 animate-pulse">
                  <div className="h-4 w-3/4 rounded bg-paper/10 mb-3" />
                  <div className="h-3 w-1/2 rounded bg-paper/5 mb-2" />
                  <div className="h-3 w-2/3 rounded bg-paper/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {pageState.status === 'ok' && experiences.length === 0 && (
            <div className="bg-ink border border-gold/20 rounded-lg p-10 text-center">
              <Star className="w-10 h-10 text-gold/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">No Experiences</div>
              <p className="text-paper/40 text-[13px] max-w-md mx-auto">
                No experiences listed yet — experiences you list on Owambe Experiences will appear here when syndicated through CC.
              </p>
            </div>
          )}

          {/* Experience cards */}
          {pageState.status === 'ok' && experiences.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {experiences.map(exp => (
                <div key={exp.id} className="bg-ink border border-paper/10 rounded-lg overflow-hidden">
                  {exp.primaryImage && (
                    <div className="h-36 bg-paper/5 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={exp.primaryImage.url} alt={exp.primaryImage.caption || exp.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-[14px] leading-snug">{exp.name}</h3>
                      <span className={`shrink-0 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_COLORS[exp.status] ?? 'text-paper/40 bg-paper/5 border-paper/10'}`}>
                        {STATUS_LABELS[exp.status] ?? exp.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-paper/50 mb-1">
                      <span className="font-mono uppercase tracking-wide text-[10px] bg-paper/5 border border-paper/10 px-1.5 py-0.5 rounded">
                        {TYPE_LABELS[exp.experienceType] ?? exp.experienceType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] text-paper/50 mt-2">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{exp.meetingPointDescription}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-[12px] text-paper/40">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{exp.durationMinutes} min</span>
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />Up to {exp.capacity}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-paper/5 text-[13px] font-medium text-gold">
                      {formatPrice(exp.basePrice, exp.baseCurrency, exp.pricingModel)}
                    </div>
                    <div className="text-[10px] text-paper/30 mt-1">
                      Added {new Date(exp.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
