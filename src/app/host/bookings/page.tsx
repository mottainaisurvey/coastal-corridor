'use client';

/**
 * /host/bookings — CC-C-08-C-1 AC-2b/c/d
 *
 * Renders the authenticated host's CC-channel bookings grouped by status.
 * Groups: Upcoming, In-stay, Recent (last 30 days), Cancelled, Pending.
 * Empty sections are omitted entirely (AC-2c).
 * Sort within section: checkInDate ascending for upcoming/in-stay;
 *   descending for recent, cancelled, pending (AC-2d).
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MapPin, Calendar, FileText, Settings, LogOut, RefreshCw } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface Booking {
  id: string;
  owambeReservationId: string | null;
  guestName: string;
  guestEmail: string;
  propertyName: string;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  netToHost: number;
  cancellationReason: string | null;
}

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: T };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  CONFIRMED: { label: 'Confirmed', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  CHECKED_IN: { label: 'In-stay', className: 'bg-ocean/10 text-ocean-2 border border-ocean/20' },
  CHECKED_OUT: { label: 'Checked out', className: 'bg-paper/5 text-paper/50 border border-paper/10' },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  REFUNDED: { label: 'Refunded', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  NO_SHOW: { label: 'No-show', className: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  PENDING: { label: 'Pending', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function groupBookings(bookings: Booking[]): { section: string; items: Booking[] }[] {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const upcoming = bookings
    .filter((b) => b.status === 'CONFIRMED' && new Date(b.checkInDate) > now)
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  const inStay = bookings
    .filter((b) => b.status === 'CHECKED_IN')
    .sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());

  const recent = bookings
    .filter((b) => b.status === 'CHECKED_OUT' && new Date(b.checkOutDate) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  const cancelled = bookings
    .filter((b) => ['CANCELLED', 'REFUNDED', 'NO_SHOW'].includes(b.status))
    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  const pending = bookings
    .filter((b) => b.status === 'PENDING')
    .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());

  const sections = [
    { section: 'Upcoming', items: upcoming },
    { section: 'In-stay', items: inStay },
    { section: 'Recent', items: recent },
    { section: 'Cancelled', items: cancelled },
    { section: 'Pending', items: pending },
  ];

  // Omit empty sections (AC-2c)
  return sections.filter((s) => s.items.length > 0);
}

function HostSidebar({ activePath, user }: { activePath: string; user: any }) {
  const navItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/host/dashboard' },
    { icon: MapPin, label: 'Properties', href: '/host/properties' },
    { icon: Calendar, label: 'Bookings', href: '/host/bookings' },
    { icon: FileText, label: 'Revenue', href: '/host/revenue' },
    { icon: Settings, label: 'Settings', href: '/host/settings' },
  ];
  return (
    <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col shrink-0">
      <div className="p-6 border-b border-paper/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-ocean/10 border border-ocean/20 flex items-center justify-center">
            <Home className="w-4 h-4 text-ocean-2" />
          </div>
          <div>
            <div className="font-serif text-[15px] font-light">Coastal Corridor</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40 mt-0.5">Host Portal</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
              activePath === href
                ? 'bg-ocean/10 text-ocean-2 border border-ocean/20'
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
          <div className="w-8 h-8 rounded-full bg-ocean/10 border border-ocean/20 flex items-center justify-center">
            <span className="text-ocean-2 text-[11px] font-mono">{user?.firstName?.[0] || 'H'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user?.fullName || 'Host'}</div>
            <div className="text-[11px] text-paper/40 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
        <Link href="/host/sign-in" className="flex items-center gap-2 px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}

export default function HostBookingsPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [state, setState] = useState<FetchState<Booking[]>>({ status: 'loading' });

  // CC-C-09-A-0.1: array-aware role check
  const isHost = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['HOST', 'host', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isHost) router.replace('/host/sign-in');
  }, [isLoaded, isHost, router]);

  const fetchData = () => {
    setState({ status: 'loading' });
    fetch('/api/host/bookings')
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setState({ status: 'ok', data: d.bookings }))
      .catch(() => setState({ status: 'error', message: 'Unable to load bookings — please retry.' }));
  };

  useEffect(() => {
    if (isLoaded && isHost) fetchData();
  }, [isLoaded, isHost]);

  if (!isLoaded || !isHost) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ocean/20" />
          <div className="h-4 w-32 rounded bg-paper/10" />
        </div>
      </div>
    );
  }

  const groups = state.status === 'ok' ? groupBookings(state.data) : [];
  const isEmpty = state.status === 'ok' && groups.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <HostSidebar activePath="/host/bookings" user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Bookings</div>
            <h1 className="font-serif text-3xl font-light">Your Bookings</h1>
            <p className="text-paper/50 text-[14px] mt-1">CC-channel bookings across your properties.</p>
          </div>

          {/* Error banner */}
          {state.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-[13px] text-red-400">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{state.message}</span>
              <button onClick={fetchData} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {state.status === 'loading' && (
            <div className="space-y-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 w-24 bg-paper/10 rounded mb-3" />
                  <div className="bg-ink border border-paper/10 rounded-lg p-5">
                    <div className="h-4 w-1/2 bg-paper/10 rounded mb-2" />
                    <div className="h-3 w-1/3 bg-paper/10 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state — all sections empty (AC-2c) */}
          {isEmpty && (
            <div className="bg-ink border border-paper/10 rounded-lg p-10 text-center">
              <Calendar className="w-10 h-10 text-ocean-2/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">No Bookings</div>
              <p className="text-paper/40 text-[13px] max-w-sm mx-auto">
                No bookings yet — bookings will appear here when guests book your properties via CC.
              </p>
            </div>
          )}

          {/* Status-grouped booking cards (AC-2b) */}
          {state.status === 'ok' && !isEmpty && (
            <div className="space-y-8">
              {groups.map(({ section, items }) => (
                <div key={section}>
                  <div className="font-mono text-[11px] uppercase tracking-widest text-paper/40 mb-3">{section}</div>
                  <div className="space-y-3">
                    {items.map((booking) => {
                      const badge = STATUS_BADGE[booking.status] ?? STATUS_BADGE.PENDING;
                      return (
                        <div key={booking.id} className="bg-ink border border-paper/10 rounded-lg p-5">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <div className="font-serif text-[15px] font-light">{booking.guestName}</div>
                              <div className="text-[12px] text-paper/40 mt-0.5">{booking.propertyName}</div>
                            </div>
                            <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full ${badge.className}`}>
                              {badge.label}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12px]">
                            <div>
                              <div className="text-paper/40 mb-0.5">Check-in</div>
                              <div>{formatDate(booking.checkInDate)}</div>
                            </div>
                            <div>
                              <div className="text-paper/40 mb-0.5">Check-out</div>
                              <div>{formatDate(booking.checkOutDate)}</div>
                            </div>
                            <div>
                              <div className="text-paper/40 mb-0.5">Total</div>
                              <div>{formatAmount(booking.totalAmount, booking.currency)}</div>
                            </div>
                            <div>
                              <div className="text-paper/40 mb-0.5">Net to host</div>
                              <div className="text-emerald-400">{formatAmount(booking.netToHost, booking.currency)}</div>
                            </div>
                          </div>
                          {booking.cancellationReason && (
                            <div className="mt-3 text-[11px] text-red-400/70 border-t border-paper/5 pt-3">
                              Cancellation reason: {booking.cancellationReason}
                            </div>
                          )}
                        </div>
                      );
                    })}
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
