'use client';

/**
 * /operator/revenue — CC-C-09-C-1 AC-3b
 *
 * Read-only revenue breakdown view.
 * Structure:
 *   - Header: lifetime total + current-month total
 *   - Monthly buckets for last 12 months (zero-revenue months omitted)
 *   - Within each month: line items (booking ID, guest, experience, date, amounts)
 *   - Empty state if no revenue records
 *
 * Currency: single-currency display if uniform; NGN-only sum + footnote if mixed.
 * No conversion logic.
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, BarChart3, Star, Calendar, FileText, Settings, LogOut, RefreshCw } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface LineItem {
  bookingId:               string;
  owambeBookingId:         string;
  experienceName:          string;
  experienceDate:          string;
  guestName:               string;
  numberOfParticipants:    number;
  paymentStatus:           string;
  totalAmount:             number;
  currency:                string;
  netToOperator:           number;
  channelCommissionAmount: number;
  channelCommissionPercent: number;
  includedInSum:           boolean;
}

interface MonthBucket {
  monthKey:   string;
  monthLabel: string;
  totalNet:   number;
  currency:   string;
  isMixed:    boolean;
  lineItems:  LineItem[];
}

interface RevenueSummary {
  lifetimeNet:          number;
  lifetimeCurrency:     string;
  lifetimeMixed:        boolean;
  currentMonthNet:      number;
  currentMonthCurrency: string;
  currentMonthMixed:    boolean;
  currentMonthKey:      string;
}

interface RevenueData {
  months:  MonthBucket[];
  summary: RevenueSummary;
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: RevenueData };

function formatAmount(amount: number, currency: string): string {
  const symbol = currency === 'NGN' ? '₦' : currency + ' ';
  return symbol + amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

const PAYMENT_BADGE: Record<string, string> = {
  PAID:           'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  DEPOSIT_PAID:   'text-emerald-400/70 bg-emerald-400/5 border-emerald-400/10',
  PARTIALLY_PAID: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  PENDING:        'text-paper/40 bg-paper/5 border-paper/10',
  REFUNDED:       'text-laterite bg-laterite/10 border-laterite/20',
};

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

export default function OperatorRevenuePage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });

  const isOperator = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['OPERATOR', 'operator', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isOperator) router.replace('/operator/sign-in');
  }, [isLoaded, isOperator, router]);

  const fetchRevenue = () => {
    setPageState({ status: 'loading' });
    fetch('/api/operator/revenue')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => setPageState({ status: 'ok', data }))
      .catch(err => {
        console.error('[operator/revenue] fetch error:', err);
        setPageState({ status: 'error', message: 'Unable to load revenue — please refresh.' });
      });
  };

  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetchRevenue();
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

  const data = pageState.status === 'ok' ? pageState.data : null;
  const months = data?.months ?? [];
  const summary = data?.summary;
  const isEmpty = pageState.status === 'ok' && months.length === 0;

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <OperatorSidebar active="Revenue" user={user} />

      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Portal</div>
            <h1 className="font-serif text-3xl font-light">Revenue</h1>
            <p className="text-paper/50 text-[14px] mt-1">CC-channel earnings from your experiences.</p>
          </div>

          {/* Error banner */}
          {pageState.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{pageState.message}</span>
              <button onClick={fetchRevenue} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {pageState.status === 'loading' && (
            <div className="space-y-4 animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="h-3 w-1/2 rounded bg-paper/10 mb-3" />
                  <div className="h-7 w-2/3 rounded bg-paper/10" />
                </div>
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="h-3 w-1/2 rounded bg-paper/10 mb-3" />
                  <div className="h-7 w-2/3 rounded bg-paper/10" />
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="bg-ink border border-gold/20 rounded-lg p-10 text-center">
              <FileText className="w-10 h-10 text-gold/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">No Revenue</div>
              <p className="text-paper/40 text-[13px] max-w-md mx-auto">
                No revenue yet — earnings will appear here once your bookings are paid.
              </p>
            </div>
          )}

          {/* Revenue summary header */}
          {summary && months.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">Lifetime Earnings</div>
                  <div className="text-2xl font-serif font-light text-gold">
                    {formatAmount(summary.lifetimeNet, summary.lifetimeCurrency)}
                    {summary.lifetimeMixed && <span className="text-paper/30 text-sm">*</span>}
                  </div>
                  <div className="text-[11px] text-paper/30 mt-1">All paid bookings</div>
                </div>
                <div className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">This Month</div>
                  <div className="text-2xl font-serif font-light text-paper">
                    {formatAmount(summary.currentMonthNet, summary.currentMonthCurrency)}
                    {summary.currentMonthMixed && <span className="text-paper/30 text-sm">*</span>}
                  </div>
                  <div className="text-[11px] text-paper/30 mt-1">
                    {summary.currentMonthNet === 0 ? 'No paid bookings this month' : 'Paid bookings this month'}
                  </div>
                </div>
              </div>

              {(summary.lifetimeMixed || summary.currentMonthMixed) && (
                <p className="text-[11px] text-paper/30 mb-6">
                  * Revenue shown in NGN only. This operator has bookings in multiple currencies. Full multi-currency aggregation is pending.
                </p>
              )}

              {/* Monthly buckets */}
              <div className="space-y-6">
                {months.map(month => (
                  <div key={month.monthKey} className="bg-ink border border-paper/10 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-paper/10 bg-paper/2">
                      <div className="font-mono text-[12px] uppercase tracking-widest text-paper/60">{month.monthLabel}</div>
                      <div className="text-[13px] font-medium text-gold">
                        {formatAmount(month.totalNet, month.currency)}
                        {month.isMixed && <span className="text-paper/30 text-[11px]">*</span>}
                      </div>
                    </div>
                    <div className="divide-y divide-paper/5">
                      {month.lineItems.map(item => (
                        <div key={item.bookingId} className={`px-5 py-3 ${!item.includedInSum ? 'opacity-50' : ''}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium truncate">{item.experienceName}</div>
                              <div className="text-[11px] text-paper/50 mt-0.5">
                                {item.guestName} · {item.numberOfParticipants} pax · {formatDate(item.experienceDate)}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[13px] font-medium">{formatAmount(item.netToOperator, item.currency)}</div>
                              <div className="text-[10px] text-paper/30 mt-0.5">
                                {formatAmount(item.totalAmount, item.currency)} total
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[10px] font-mono uppercase tracking-wide px-1.5 py-0.5 rounded border ${PAYMENT_BADGE[item.paymentStatus] ?? 'text-paper/40 bg-paper/5 border-paper/10'}`}>
                              {item.paymentStatus.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-paper/30">
                              {item.channelCommissionPercent}% CC commission ({formatAmount(item.channelCommissionAmount, item.currency)})
                            </span>
                          </div>
                        </div>
                      ))}
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
