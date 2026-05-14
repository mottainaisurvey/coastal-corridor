'use client';

/**
 * /operator/dashboard — CC-C-09-B
 *
 * Complete replacement of the agent-template scaffold. The previous placeholder
 * contained Destinations / Agents / Reports nav links and hardcoded stats
 * ("Active Agents: 62") — none of which are operator-shaped. This file removes
 * that scaffolding entirely and builds an operator-shaped dashboard.
 *
 * Structure mirrors the host dashboard pattern from CC-C-08-B:
 *   - Sidebar: Dashboard (active), Experiences, Bookings, Revenue, Settings
 *   - Main: three stats panels (Experiences, Bookings, Revenue) in a responsive grid
 *   - Loading state: pulsing values while stats are fetching
 *   - Error state: graceful error banner with retry
 *   - Zero state: operator-appropriate sublines for empty data
 *
 * Sub-routes (/operator/experiences, /operator/bookings, /operator/revenue,
 * /operator/settings) are linked but not yet built — CC-C-09-C-1 builds them.
 * This matches the same intermediate-state pattern used in CC-C-08-B.
 *
 * AC-1 (CC-C-09-B): structural rebuild
 * AC-3 (CC-C-09-B): three stats panels with loading/error/zero states
 * AC-6 (CC-C-09-B): navigation consistency
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, BarChart3, Star, Calendar, FileText, Settings, LogOut, RefreshCw } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface OperatorStats {
  experiencesCount: number;
  bookingsCount: number;
  revenue: {
    amount: number;
    currency: string;
    isMixed: boolean;
  };
  meta: {
    operatorUserId: string;
    monthStart: string;
    monthEnd: string;
  };
}

type StatsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: OperatorStats };

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

export default function OperatorDashboardPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [statsState, setStatsState] = useState<StatsState>({ status: 'loading' });

  // CC-C-09-A-0.1: array-aware role check (supports legacy string and new array form)
  const isOperator = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['OPERATOR', 'operator', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  // Auth redirect
  useEffect(() => {
    if (isLoaded && !isOperator) {
      router.replace('/operator/sign-in');
    }
  }, [isLoaded, isOperator, router]);

  // CC-C-09-A AC-6: Idempotent OperatorProfile provisioning on dashboard load.
  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetch('/api/operator/provision', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.provisioned) {
          console.log('[operator/dashboard] OperatorProfile provisioned:', data.profileId, 'wasNew:', data.wasNew);
        }
      })
      .catch((err) => console.error('[operator/dashboard] provision error:', err));
  }, [isLoaded, isOperator]);

  // CC-C-09-B: Fetch real dashboard stats
  const fetchStats = () => {
    setStatsState({ status: 'loading' });
    fetch('/api/operator/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
        return res.json();
      })
      .then((data: OperatorStats) => {
        setStatsState({ status: 'ok', data });
      })
      .catch((err) => {
        console.error('[operator/dashboard] stats fetch error:', err);
        setStatsState({ status: 'error', message: 'Unable to load stats — please refresh.' });
      });
  };

  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetchStats();
  }, [isLoaded, isOperator]);

  // Auth loading skeleton
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

  // Derive stat display values
  const stats = statsState.status === 'ok' ? statsState.data : null;
  const isStatsLoading = statsState.status === 'loading';
  const isStatsError = statsState.status === 'error';

  const experiencesValue = isStatsLoading ? '…' : isStatsError ? '—' : String(stats!.experiencesCount);
  const experiencesSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : stats!.experiencesCount === 0
    ? 'No experiences listed'
    : stats!.experiencesCount === 1
    ? '1 experience listed'
    : `${stats!.experiencesCount} experiences listed`;

  const bookingsValue = isStatsLoading ? '…' : isStatsError ? '—' : String(stats!.bookingsCount);
  const bookingsSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : stats!.bookingsCount === 0
    ? 'No bookings yet'
    : 'CC-channel bookings';

  const revenueValue = isStatsLoading
    ? '…'
    : isStatsError
    ? '—'
    : formatRevenue(stats!.revenue.amount, stats!.revenue.currency, stats!.revenue.isMixed);
  const revenueSubline = isStatsLoading
    ? 'Loading…'
    : isStatsError
    ? 'Unavailable'
    : stats!.revenue.amount === 0
    ? 'No paid bookings this month'
    : currentMonthLabel(stats?.meta.monthStart);

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      {/* Sidebar */}
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
          {[
            { icon: BarChart3, label: 'Dashboard',    href: '/operator/dashboard',    active: true  },
            { icon: Star,      label: 'Experiences',  href: '/operator/experiences',  active: false },
            { icon: Calendar,  label: 'Bookings',     href: '/operator/bookings',     active: false },
            { icon: FileText,  label: 'Revenue',      href: '/operator/revenue',      active: false },
            { icon: Settings,  label: 'Settings',     href: '/operator/settings',     active: false },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                active
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
          <Link
            href="/operator/sign-in"
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Dashboard</div>
            <h1 className="font-serif text-3xl font-light">Welcome back, {user?.firstName || 'Operator'}</h1>
            <p className="text-paper/50 text-[14px] mt-1">Manage your coastal experiences and bookings.</p>
          </div>

          {/* Error banner */}
          {isStatsError && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{(statsState as { status: 'error'; message: string }).message}</span>
              <button
                onClick={fetchStats}
                className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline"
              >
                Retry
              </button>
            </div>
          )}

          {/* Stats grid — three panels: Experiences, Bookings, Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Experiences',                                         value: experiencesValue, subline: experiencesSubline },
              { label: 'Active Bookings',                                     value: bookingsValue,    subline: bookingsSubline    },
              { label: `Revenue (${stats?.revenue.currency ?? 'NGN'})`,       value: revenueValue,     subline: revenueSubline     },
            ].map(({ label, value, subline }) => (
              <div key={label} className="bg-ink border border-paper/10 rounded-lg p-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">{label}</div>
                <div
                  className={`text-2xl font-serif font-light ${
                    isStatsLoading ? 'text-paper/30 animate-pulse' : 'text-paper'
                  }`}
                >
                  {value}
                </div>
                <div className="text-[11px] text-paper/40 mt-1">{subline}</div>
              </div>
            ))}
          </div>

          {/* Mixed-currency footnote */}
          {stats?.revenue.isMixed && (
            <p className="text-[11px] text-paper/30 mb-6">
              * Revenue shown in NGN only. This operator has bookings in multiple currencies. Full multi-currency aggregation is pending.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
