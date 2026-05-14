'use client';

/**
 * /host/dashboard — CC-C-08-B
 *
 * Replaces the placeholder stats with real data fetched from GET /api/host/stats.
 * Changes from the CC-C-08-A placeholder:
 *   - Stats (properties, bookings, revenue) are fetched server-side via /api/host/stats
 *   - Occupancy is deferred to v2 (requires calendar data from Owambe Stays via callOwambe)
 *   - Loading state: spinner while stats are loading (not stale hardcoded zeros)
 *   - Error state: graceful "Unable to load stats — please refresh" if the fetch fails
 *   - Zero state: real zeros from the API (visually identical to placeholder zeros)
 *   - "Coming soon" notice removed once real stats render
 *   - HostProfile provisioning (CC-C-08-A AC-2) retained
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MapPin, Calendar, FileText, Settings, LogOut, RefreshCw } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface HostStats {
  propertiesActive: number;
  propertiesReview: number;
  bookings: number;
  revenueThisMonth: number;
  revenueCurrency: string;
  revenueMixed: boolean;
  occupancy: null; // deferred to v2
  meta: {
    hostUserId: string;
    monthStart: string;
    monthEnd: string;
  };
}

type StatsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: HostStats };

function formatRevenue(amount: number, currency: string, mixed: boolean): string {
  const symbol = currency === 'NGN' ? '₦' : currency + ' ';
  const formatted = symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return mixed ? `${formatted}*` : formatted;
}

function currentMonthLabel(monthStart?: string): string {
  if (!monthStart) return 'This month';
  const d = new Date(monthStart);
  return d.toLocaleString('en-NG', { month: 'long', year: 'numeric' });
}

export default function HostDashboardPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [statsState, setStatsState] = useState<StatsState>({ status: 'loading' });

  // CC-C-09-A-0.1: array-aware role check (supports legacy string and new array form)
  const isHost = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['HOST', 'host', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  // Auth redirect
  useEffect(() => {
    if (isLoaded && !isHost) {
      router.replace('/host/sign-in');
    }
  }, [isLoaded, isHost, router]);

  // CC-C-08-A AC-2: Idempotent HostProfile provisioning on dashboard load.
  useEffect(() => {
    if (!isLoaded || !isHost) return;
    fetch('/api/host/provision', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.provisioned) {
          console.log('[host/dashboard] HostProfile provisioned:', data.profileId, 'wasNew:', data.wasNew);
        }
      })
      .catch((err) => console.error('[host/dashboard] provision error:', err));
  }, [isLoaded, isHost]);

  // CC-C-08-B: Fetch real dashboard stats
  useEffect(() => {
    if (!isLoaded || !isHost) return;
    setStatsState({ status: 'loading' });
    fetch('/api/host/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: HostStats) => {
        setStatsState({ status: 'ok', data });
      })
      .catch((err) => {
        console.error('[host/dashboard] stats fetch error:', err);
        setStatsState({ status: 'error', message: 'Unable to load stats — please refresh.' });
      });
  }, [isLoaded, isHost]);

  // Auth loading skeleton
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

  // Derive stat display values
  const stats = statsState.status === 'ok' ? statsState.data : null;
  const isStatsLoading = statsState.status === 'loading';
  const isStatsError = statsState.status === 'error';

  const propertiesValue = isStatsLoading ? '…' : isStatsError ? '—' : String(stats!.propertiesActive);
  const propertiesSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : stats!.propertiesReview > 0
    ? `${stats!.propertiesReview} under review`
    : stats!.propertiesActive === 0
    ? 'Add your first'
    : 'Active';

  const bookingsValue = isStatsLoading ? '…' : isStatsError ? '—' : String(stats!.bookings);
  const bookingsSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : stats!.bookings === 0
    ? 'No bookings yet'
    : 'CC-channel bookings';

  const revenueValue = isStatsLoading
    ? '…'
    : isStatsError
    ? '—'
    : formatRevenue(stats!.revenueThisMonth, stats!.revenueCurrency, stats!.revenueMixed);
  const revenueSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : currentMonthLabel(stats?.meta.monthStart);

  // Occupancy: deferred to v2
  // Requires calendar data from Owambe Stays; implementation pending callOwambe wiring.
  const occupancyValue = '—';
  const occupancySubline = 'Coming soon';

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col">
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
          {[
            { icon: BarChart3, label: 'Dashboard', href: '/host/dashboard', active: true },
            { icon: MapPin, label: 'Properties', href: '/host/properties' },
            { icon: Calendar, label: 'Bookings', href: '/host/bookings' },
            { icon: FileText, label: 'Revenue', href: '/host/revenue' },
            { icon: Settings, label: 'Settings', href: '/host/settings' },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                active ? 'bg-ocean/10 text-ocean-2 border border-ocean/20' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
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

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Host Dashboard</div>
            <h1 className="font-serif text-3xl font-light">Welcome back, {user?.firstName || 'Host'}</h1>
            <p className="text-paper/50 text-[14px] mt-1">Manage your coastal properties and bookings.</p>
          </div>

          {/* Error banner (AC-6a) */}
          {isStatsError && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{(statsState as { status: 'error'; message: string }).message}</span>
              <button
                onClick={() => {
                  setStatsState({ status: 'loading' });
                  fetch('/api/host/stats')
                    .then((r) => r.ok ? r.json() : Promise.reject(r.status))
                    .then((d) => setStatsState({ status: 'ok', data: d }))
                    .catch(() => setStatsState({ status: 'error', message: 'Unable to load stats — please refresh.' }));
                }}
                className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats grid (AC-1/2/3/4) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Properties', value: propertiesValue, subline: propertiesSubline },
              { label: 'Active Bookings', value: bookingsValue, subline: bookingsSubline },
              { label: `Revenue (${stats?.revenueCurrency ?? 'NGN'})`, value: revenueValue, subline: revenueSubline },
              { label: 'Occupancy Rate', value: occupancyValue, subline: occupancySubline },
            ].map(({ label, value, subline }) => (
              <div key={label} className="bg-ink border border-paper/10 rounded-lg p-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">{label}</div>
                <div className={`text-2xl font-serif font-light ${isStatsLoading ? 'text-paper/30 animate-pulse' : 'text-paper'}`}>
                  {value}
                </div>
                <div className="text-[11px] text-paper/40 mt-1">{subline}</div>
              </div>
            ))}
          </div>

          {/* Mixed-currency footnote (AC-3c) */}
          {stats?.revenueMixed && (
            <p className="text-[11px] text-paper/30 mb-6">
              * Revenue shown in NGN only. This host has reservations in multiple currencies. Full multi-currency aggregation is pending.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
