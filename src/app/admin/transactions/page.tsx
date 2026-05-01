'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, TrendingUp, DollarSign, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

const STATUS_COLOURS: Record<string, string> = {
  INITIATED: 'bg-ocean/10 text-ocean border border-ocean/20',
  ESCROW_FUNDED: 'bg-ochre/10 text-ochre border border-ochre/20',
  DOCUMENTS_REVIEW: 'bg-ochre/10 text-ochre border border-ochre/20',
  AWAITING_GOVT_CONSENT: 'bg-laterite/10 text-laterite border border-laterite/20',
  COMPLETED: 'bg-sage/10 text-sage border border-sage/20',
  CANCELLED: 'bg-ink/10 text-ink/50 border border-ink/20',
  DISPUTED: 'bg-laterite/10 text-laterite border border-laterite/20',
};

export default function AdminTransactionsPage() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ totalValue: 0, completed: 0, disputed: 0, inEscrow: 0 });
  const PAGE_SIZE = 20;

  // Use sessionClaims (JWT, available immediately) with fallback to publicMetadata
  const role = ((sessionClaims?.publicMetadata as any)?.role as string) || (user?.publicMetadata?.role as string) || '';
  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && userId && role && !isAdmin) router.replace('/unauthorized?required=admin');
  }, [isLoaded, userId, role, router]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const fetch_ = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page), limit: String(PAGE_SIZE),
          ...(search && { search }),
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        });
        const res = await fetch(`/api/admin/transactions?${params}`);
        if (res.ok) {
          const data = await res.json();
          setTransactions(data.data || []);
          setTotal(data.total || 0);
          if (data.summary) setSummary(data.summary);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch_();
  }, [userId, isAdmin, page, search, statusFilter]);

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (isLoaded && userId && role && !isAdmin) {
  return (
    <div className="container-x py-24">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-ink/10 rounded w-24" />
        <div className="h-10 bg-ink/10 rounded w-1/3" />
        <div className="h-4 bg-ink/10 rounded w-1/2" />
        <div className="h-4 bg-ink/10 rounded w-2/3" />
      </div>
    </div>
  );
  }

  const fmt = (kobo: number) => kobo ? new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100) : '—';
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-6xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Transactions</h1>
            <p className="text-ink/60 text-[16px]">Monitor, reconcile, and manage all platform financial transactions</p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Value', value: fmt(summary.totalValue), icon: DollarSign, colour: 'text-sage' },
              { label: 'Completed', value: summary.completed, icon: CheckCircle, colour: 'text-sage' },
              { label: 'In Escrow', value: summary.inEscrow, icon: TrendingUp, colour: 'text-ochre' },
              { label: 'Disputed', value: summary.disputed, icon: AlertTriangle, colour: 'text-laterite' },
            ].map(({ label, value, icon: Icon, colour }) => (
              <div key={label} className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="eyebrow">{label}</div>
                  <Icon className={`h-5 w-5 ${colour} opacity-40`} />
                </div>
                <div className={`font-serif text-[26px] font-medium ${colour}`}>{value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <input type="text" placeholder="Search by reference or buyer..." value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50">
              <option value="ALL">All Statuses</option>
              <option value="INITIATED">Initiated</option>
              <option value="ESCROW_FUNDED">Escrow Funded</option>
              <option value="DOCUMENTS_REVIEW">Documents Review</option>
              <option value="AWAITING_GOVT_CONSENT">Awaiting Govt Consent</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-ink/10">
              <span className="text-sm text-ink/60">{total} transaction{total !== 1 ? 's' : ''}</span>
            </div>
            {loading ? (
              <div className="p-8 text-center text-ink/40 text-sm">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">No transactions match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-paper/50">
                      {['Reference', 'Buyer', 'Listing', 'Amount', 'Status', 'Date'].map(h => (
                        <th key={h} className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {transactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-paper/40 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-ink">{t.reference}</td>
                        <td className="px-6 py-4">
                          <div className="text-ink/70">{t.buyer?.profile?.firstName} {t.buyer?.profile?.lastName}</div>
                          <div className="text-ink/40 text-xs">{t.buyer?.email}</div>
                        </td>
                        <td className="px-6 py-4 text-ink/70 text-xs">{t.listing?.property?.title || '—'}</td>
                        <td className="px-6 py-4 font-mono text-sm text-ink">{fmt(Number(t.agreedPriceKobo))}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${STATUS_COLOURS[t.status] || 'bg-ink/10 text-ink/50'}`}>
                            {t.status?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink/50 text-xs">
                          {new Date(t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-between">
                <span className="text-xs text-ink/40">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
