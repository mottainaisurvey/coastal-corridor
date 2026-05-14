'use client';

/**
 * /host/revenue — CC-C-08-C-1 AC-3b/c/d/e
 *
 * Renders the authenticated host's CC-channel revenue breakdown.
 * Header: lifetime total + current-month total.
 * Monthly buckets: last 12 months with non-zero revenue.
 * Zero-revenue empty state (AC-3d/e): renders when no paid reservations exist.
 * No charts or visualisations — numbers and text only (scope discipline note).
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MapPin, Calendar, FileText, Settings, LogOut, RefreshCw } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface LineItem {
  id: string;
  owambeReservationId: string | null;
  guestName: string;
  propertyName: string;
  checkInDate: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  netToHost: number;
  channelCommissionAmount: number;
  channelCommissionPercent: number;
  createdAt: string;
  isRevenue: boolean;
}

interface MonthlyBucket {
  monthKey: string;
  monthLabel: string;
  total: number;
  currency: string;
  items: LineItem[];
}

interface RevenueData {
  lineItems: LineItem[];
  monthlyBuckets: MonthlyBucket[];
  lifetimeTotal: number;
  currentMonthTotal: number;
  currency: string;
  revenueMixed: boolean;
  hasRevenue: boolean;
}

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: T };

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : `${currency} `;
  return symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PAID: 'Paid',
  DEPOSIT_PAID: 'Deposit paid',
  PARTIALLY_PAID: 'Partially paid',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
};

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

export default function HostRevenuePage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [state, setState] = useState<FetchState<RevenueData>>({ status: 'loading' });

  // CC-C-09-A-0.1: array-aware role check
  const isHost = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['HOST', 'host', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isHost) router.replace('/host/sign-in');
  }, [isLoaded, isHost, router]);

  const fetchData = () => {
    setState({ status: 'loading' });
    fetch('/api/host/revenue')
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setState({ status: 'ok', data: d }))
      .catch(() => setState({ status: 'error', message: 'Unable to load revenue data — please retry.' }));
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

  const data = state.status === 'ok' ? state.data : null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <HostSidebar activePath="/host/revenue" user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Revenue</div>
            <h1 className="font-serif text-3xl font-light">Revenue</h1>
            <p className="text-paper/50 text-[14px] mt-1">CC-channel earnings across your properties.</p>
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
            <div className="animate-pulse space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ink border border-paper/10 rounded-lg p-5 h-20" />
                <div className="bg-ink border border-paper/10 rounded-lg p-5 h-20" />
              </div>
              <div className="bg-ink border border-paper/10 rounded-lg p-5 h-32" />
            </div>
          )}

          {/* Empty state (AC-3d/e) */}
          {state.status === 'ok' && !data!.hasRevenue && (
            <div className="bg-ink border border-paper/10 rounded-lg p-10 text-center">
              <FileText className="w-10 h-10 text-ocean-2/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">No Revenue Yet</div>
              <p className="text-paper/40 text-[13px] max-w-sm mx-auto">
                No revenue yet — earnings will appear here once your bookings are paid.
              </p>
            </div>
          )}

          {/* Revenue content */}
          {state.status === 'ok' && data!.hasRevenue && (
            <>
              {/* Header totals (AC-3b) */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">Lifetime Total</div>
                  <div className="text-2xl font-serif font-light text-emerald-400">
                    {formatAmount(data!.lifetimeTotal, data!.currency)}
                    {data!.revenueMixed && <span className="text-[14px] text-paper/30">*</span>}
                  </div>
                </div>
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">This Month</div>
                  <div className="text-2xl font-serif font-light text-emerald-400">
                    {formatAmount(data!.currentMonthTotal, data!.currency)}
                    {data!.revenueMixed && <span className="text-[14px] text-paper/30">*</span>}
                  </div>
                </div>
              </div>

              {/* Mixed-currency footnote (AC-3c) */}
              {data!.revenueMixed && (
                <p className="text-[11px] text-paper/30 mb-6">
                  * Revenue shown in NGN only. This host has reservations in multiple currencies. Full multi-currency aggregation is pending.
                </p>
              )}

              {/* Monthly buckets (AC-3b) */}
              <div className="space-y-6">
                {data!.monthlyBuckets.map((bucket) => (
                  <div key={bucket.monthKey}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-mono text-[11px] uppercase tracking-widest text-paper/40">{bucket.monthLabel}</div>
                      <div className="text-[13px] font-medium text-emerald-400">{formatAmount(bucket.total, bucket.currency)}</div>
                    </div>
                    <div className="bg-ink border border-paper/10 rounded-lg overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-paper/5">
                            <th className="text-left px-4 py-2.5 text-paper/40 font-normal">Guest / Property</th>
                            <th className="text-left px-4 py-2.5 text-paper/40 font-normal">Check-in</th>
                            <th className="text-left px-4 py-2.5 text-paper/40 font-normal">Status</th>
                            <th className="text-right px-4 py-2.5 text-paper/40 font-normal">Total</th>
                            <th className="text-right px-4 py-2.5 text-paper/40 font-normal">CC Commission</th>
                            <th className="text-right px-4 py-2.5 text-paper/40 font-normal">Net to Host</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bucket.items.map((item) => (
                            <tr key={item.id} className="border-b border-paper/5 last:border-0">
                              <td className="px-4 py-3">
                                <div>{item.guestName}</div>
                                <div className="text-paper/40 text-[11px]">{item.propertyName}</div>
                              </td>
                              <td className="px-4 py-3 text-paper/60">{formatDate(item.checkInDate)}</td>
                              <td className="px-4 py-3 text-paper/60">{PAYMENT_STATUS_LABEL[item.paymentStatus] ?? item.paymentStatus}</td>
                              <td className="px-4 py-3 text-right">{formatAmount(item.totalAmount, item.currency)}</td>
                              <td className="px-4 py-3 text-right text-paper/50">
                                {formatAmount(item.channelCommissionAmount, item.currency)}
                                <span className="text-paper/30 ml-1">({item.channelCommissionPercent}%)</span>
                              </td>
                              <td className={`px-4 py-3 text-right font-medium ${item.isRevenue ? 'text-emerald-400' : 'text-paper/30'}`}>
                                {formatAmount(item.netToHost, item.currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
