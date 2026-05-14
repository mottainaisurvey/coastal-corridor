'use client';

/**
 * /operator/bookings — CC-C-09-C-1 AC-2c
 *
 * Read-only list view of the operator's CC-channel ExperienceBooking records,
 * grouped by status section.
 *
 * Status sections (AC-2c):
 *   - Upcoming:        CONFIRMED with future startDateTime
 *   - Today:           CONFIRMED with today's startDateTime
 *   - Recent:          COMPLETED in last 30 days
 *   - Cancelled:       CANCELLED, REFUNDED, NO_SHOW
 *   - Pending:         PENDING
 *
 * Empty sections are omitted. If all sections are empty: "No bookings yet" message.
 * Sort within sections: ascending for Upcoming/Today, descending for others.
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, BarChart3, Star, Calendar, FileText, Settings, LogOut, RefreshCw, Users, CreditCard } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface BookingItem {
  id:                      string;
  owambeBookingId:         string;
  status:                  string;
  paymentStatus:           string;
  totalAmount:             number;
  currency:                string;
  netToOperator:           number;
  channelCommissionAmount: number;
  channelCommissionPercent: number;
  numberOfParticipants:    number;
  participantNames:        string[];
  specialRequirements:     string | null;
  pickupRequested:         boolean;
  pickupAddress:           string | null;
  cancellationReason:      string | null;
  cancellationInitiatedBy: string | null;
  createdAt:               string;
  updatedAt:               string;
  experience: {
    id:             string;
    name:           string;
    experienceType: string;
    durationMinutes: number;
  };
  timeSlot: {
    startDateTime: string;
    endDateTime:   string;
  };
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; bookings: BookingItem[] };

const STATUS_BADGE: Record<string, string> = {
  PENDING:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
  CONFIRMED:  'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  COMPLETED:  'text-ocean-2 bg-ocean-2/10 border-ocean-2/20',
  CANCELLED:  'text-laterite bg-laterite/10 border-laterite/20',
  NO_SHOW:    'text-paper/40 bg-paper/5 border-paper/10',
  REFUNDED:   'text-paper/40 bg-paper/5 border-paper/10',
};

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : currency + ' ';
  return symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return d.getUTCFullYear() === now.getUTCFullYear() &&
         d.getUTCMonth()    === now.getUTCMonth()    &&
         d.getUTCDate()     === now.getUTCDate();
}

function groupBookings(bookings: BookingItem[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const upcoming:  BookingItem[] = [];
  const today:     BookingItem[] = [];
  const recent:    BookingItem[] = [];
  const cancelled: BookingItem[] = [];
  const pending:   BookingItem[] = [];

  for (const b of bookings) {
    const start = new Date(b.timeSlot.startDateTime);
    if (b.status === 'CONFIRMED') {
      if (isToday(b.timeSlot.startDateTime)) today.push(b);
      else if (start > now) upcoming.push(b);
      else recent.push(b); // confirmed but past — treat as recent
    } else if (b.status === 'COMPLETED') {
      if (start >= thirtyDaysAgo) recent.push(b);
      else recent.push(b); // include all completed regardless of age
    } else if (['CANCELLED', 'REFUNDED', 'NO_SHOW'].includes(b.status)) {
      cancelled.push(b);
    } else if (b.status === 'PENDING') {
      pending.push(b);
    }
  }

  // Sort: ascending for upcoming/today, descending for others
  upcoming.sort((a, b) => new Date(a.timeSlot.startDateTime).getTime() - new Date(b.timeSlot.startDateTime).getTime());
  today.sort((a, b) => new Date(a.timeSlot.startDateTime).getTime() - new Date(b.timeSlot.startDateTime).getTime());
  recent.sort((a, b) => new Date(b.timeSlot.startDateTime).getTime() - new Date(a.timeSlot.startDateTime).getTime());
  cancelled.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  pending.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { upcoming, today, recent, cancelled, pending };
}

function BookingCard({ booking }: { booking: BookingItem }) {
  const guestName = booking.participantNames?.[0] ?? `Guest (${booking.numberOfParticipants} pax)`;
  return (
    <div className="bg-ink border border-paper/10 rounded-lg p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-medium text-[14px]">{booking.experience.name}</div>
          <div className="text-[12px] text-paper/50 mt-0.5">{guestName}</div>
        </div>
        <span className={`shrink-0 text-[10px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_BADGE[booking.status] ?? 'text-paper/40 bg-paper/5 border-paper/10'}`}>
          {booking.status}
        </span>
      </div>
      <div className="text-[12px] text-paper/50 mb-2">
        <Calendar className="w-3 h-3 inline mr-1" />
        {formatDate(booking.timeSlot.startDateTime)}
      </div>
      <div className="flex items-center gap-3 text-[12px] text-paper/40">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{booking.numberOfParticipants}</span>
        <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" />{formatAmount(booking.totalAmount, booking.currency)}</span>
        <span className="text-gold">Net: {formatAmount(booking.netToOperator, booking.currency)}</span>
      </div>
      {booking.cancellationReason && (
        <div className="mt-2 text-[11px] text-laterite/70 bg-laterite/5 border border-laterite/10 rounded px-2 py-1">
          Cancelled: {booking.cancellationReason}
        </div>
      )}
    </div>
  );
}

function SectionBlock({ title, bookings }: { title: string; bookings: BookingItem[] }) {
  if (bookings.length === 0) return null;
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-paper/50">{title}</h2>
        <span className="text-[10px] font-mono text-paper/30 bg-paper/5 border border-paper/10 px-1.5 py-0.5 rounded">{bookings.length}</span>
      </div>
      <div className="space-y-3">
        {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
      </div>
    </div>
  );
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
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
              active === label ? 'bg-gold/10 text-gold border border-gold/20' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
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
          <LogOut className="w-3.5 h-3.5" />Sign out
        </Link>
      </div>
    </aside>
  );
}

export default function OperatorBookingsPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });

  const isOperator = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['OPERATOR', 'operator', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isOperator) router.replace('/operator/sign-in');
  }, [isLoaded, isOperator, router]);

  const fetchBookings = () => {
    setPageState({ status: 'loading' });
    fetch('/api/operator/bookings')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => setPageState({ status: 'ok', bookings: data.bookings }))
      .catch(err => {
        console.error('[operator/bookings] fetch error:', err);
        setPageState({ status: 'error', message: 'Unable to load bookings — please refresh.' });
      });
  };

  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetchBookings();
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

  const bookings = pageState.status === 'ok' ? pageState.bookings : [];
  const groups = groupBookings(bookings);
  const allEmpty = pageState.status === 'ok' && bookings.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <OperatorSidebar active="Bookings" user={user} />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Portal</div>
            <h1 className="font-serif text-3xl font-light">Bookings</h1>
            <p className="text-paper/50 text-[14px] mt-1">CC-channel bookings for your experiences.</p>
          </div>

          {/* Error banner */}
          {pageState.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{pageState.message}</span>
              <button onClick={fetchBookings} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {pageState.status === 'loading' && (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-ink border border-paper/10 rounded-lg p-4 animate-pulse">
                  <div className="h-4 w-1/2 rounded bg-paper/10 mb-2" />
                  <div className="h-3 w-1/3 rounded bg-paper/5" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {allEmpty && (
            <div className="bg-ink border border-gold/20 rounded-lg p-10 text-center">
              <Calendar className="w-10 h-10 text-gold/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">No Bookings</div>
              <p className="text-paper/40 text-[13px] max-w-md mx-auto">
                No bookings yet — bookings will appear here when guests book your experiences via CC.
              </p>
            </div>
          )}

          {/* Status sections */}
          {pageState.status === 'ok' && bookings.length > 0 && (
            <>
              <SectionBlock title="Today / In-progress" bookings={groups.today} />
              <SectionBlock title="Upcoming"            bookings={groups.upcoming} />
              <SectionBlock title="Recent"              bookings={groups.recent} />
              <SectionBlock title="Pending"             bookings={groups.pending} />
              <SectionBlock title="Cancelled"           bookings={groups.cancelled} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
