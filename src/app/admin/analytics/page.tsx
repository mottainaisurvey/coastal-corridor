'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Users, Home, DollarSign, BarChart2, Activity } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

export default function AdminAnalyticsPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');

  const role = (user?.publicMetadata?.role as string) || '';
  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isAdmin) router.replace('/unauthorized?required=admin');
  }, [isLoaded, user, isAdmin, router]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchStats();
  }, [userId, isAdmin, period]);

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isAdmin) return null;

  const metrics = stats ? [
    { label: 'Total Users', value: stats.totalUsers, sub: `${stats.agents} agents · ${stats.developers} developers · ${stats.buyers} buyers`, icon: Users, colour: 'text-ocean' },
    { label: 'Active Listings', value: stats.activeListings, sub: `${stats.pendingListings} pending · ${stats.soldListings} sold`, icon: Home, colour: 'text-laterite' },
    { label: 'Verified Agents', value: stats.verifiedAgents, sub: `${stats.pendingAgentVerification} pending verification`, icon: Activity, colour: 'text-sage' },
    { label: 'Total Transactions', value: stats.totalTransactions, sub: `${stats.completedTransactions} completed · ${stats.failedTransactions} cancelled`, icon: DollarSign, colour: 'text-ochre' },
    { label: 'Pending Verification', value: stats.pendingVerification, sub: 'Plots + agent licences', icon: TrendingUp, colour: 'text-laterite' },
    { label: 'New Inquiries', value: stats.newInquiries, sub: 'Uncontacted inquiries', icon: BarChart2, colour: 'text-ocean' },
  ] : [];

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Analytics</h1>
            <p className="text-ink/60 text-[16px]">Platform-wide performance metrics and growth indicators</p>
          </div>

          {/* Period selector */}
          <div className="flex gap-1 mb-8 bg-white border border-ink/10 rounded-lg p-1 w-fit">
            {['7d', '30d', '90d', 'all'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${period === p ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'}`}>
                {p === 'all' ? 'All Time' : `Last ${p}`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse">
                  <div className="h-3 bg-ink/10 rounded w-1/2 mb-4" />
                  <div className="h-8 bg-ink/10 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Key metrics grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                {metrics.map(({ label, value, sub, icon: Icon, colour }) => (
                  <div key={label} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="eyebrow">{label}</div>
                      <Icon className={`h-5 w-5 ${colour} opacity-30`} />
                    </div>
                    <div className={`font-serif text-[32px] font-medium ${colour} mb-1`}>{value ?? '—'}</div>
                    <div className="text-xs text-ink/40">{sub}</div>
                  </div>
                ))}
              </div>

              {/* User breakdown */}
              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card mb-6">
                <div className="eyebrow mb-4">User Role Distribution</div>
                {stats && (
                  <div className="space-y-3">
                    {[
                      { label: 'Buyers', count: stats.buyers, total: stats.totalUsers, colour: 'bg-ocean' },
                      { label: 'Agents', count: stats.agents, total: stats.totalUsers, colour: 'bg-laterite' },
                      { label: 'Developers', count: stats.developers, total: stats.totalUsers, colour: 'bg-ochre' },
                    ].map(({ label, count, total, colour }) => {
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={label}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-ink/70">{label}</span>
                            <span className="font-mono text-xs text-ink/50">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2 bg-ink/5 rounded-full overflow-hidden">
                            <div className={`h-full ${colour} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Transaction health */}
              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="eyebrow mb-4">Transaction Health</div>
                {stats && (
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="font-serif text-[28px] font-medium text-sage">{stats.completedTransactions}</div>
                      <div className="text-xs text-ink/40 mt-1">Completed</div>
                    </div>
                    <div>
                      <div className="font-serif text-[28px] font-medium text-ochre">
                        {stats.totalTransactions - stats.completedTransactions - stats.failedTransactions}
                      </div>
                      <div className="text-xs text-ink/40 mt-1">In Progress</div>
                    </div>
                    <div>
                      <div className="font-serif text-[28px] font-medium text-laterite">{stats.failedTransactions}</div>
                      <div className="text-xs text-ink/40 mt-1">Cancelled</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
