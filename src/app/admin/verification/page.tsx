'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, MapPin, User, FileText } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

type Tab = 'agents' | 'plots';

export default function AdminVerificationPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('agents');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingAgents: 0, pendingPlots: 0, verifiedToday: 0 });

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
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/verification?type=${tab}`);
        if (res.ok) {
          const data = await res.json();
          setItems(data.data || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, isAdmin, tab]);

  if (!isLoaded || !user) return (
    <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>
  );
  if (!isAdmin) return null;

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">
              Verification Queue
            </h1>
            <p className="text-ink/60 text-[16px]">Review and approve agent licences and plot title verifications</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Pending Agents</div>
              <div className="font-serif text-[28px] font-medium text-ochre">{stats.pendingAgents}</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Pending Plots</div>
              <div className="font-serif text-[28px] font-medium text-laterite">{stats.pendingPlots}</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Verified Today</div>
              <div className="font-serif text-[28px] font-medium text-sage">{stats.verifiedToday}</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-white border border-ink/10 rounded-lg p-1 w-fit">
            {(['agents', 'plots'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-md text-sm font-mono uppercase tracking-wider transition-colors ${
                  tab === t ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'
                }`}
              >
                {t === 'agents' ? 'Agent Licences' : 'Plot Titles'}
              </button>
            ))}
          </div>

          {/* Queue list */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-ink/10 rounded-lg p-8 text-center text-ink/40 text-sm">Loading queue...</div>
            ) : items.length === 0 ? (
              <div className="bg-white border border-ink/10 rounded-lg p-8 text-center">
                <CheckCircle className="h-10 w-10 text-sage/40 mx-auto mb-3" />
                <p className="text-ink/50 text-sm">Queue is clear — no pending {tab} verifications.</p>
              </div>
            ) : (
              items.map((item: any) => (
                <div key={item.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {tab === 'agents' ? (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-ink/30" />
                            <span className="font-medium text-ink">{item.user?.profile?.firstName} {item.user?.profile?.lastName}</span>
                            <span className="text-ink/40 text-xs">{item.user?.email}</span>
                          </div>
                          <div className="text-sm text-ink/60 mb-2">
                            Licence: <span className="font-mono text-ink">{item.licenseNumber}</span>
                            {item.agencyName && <> · {item.agencyName}</>}
                          </div>
                          {item.licenseExpiry && (
                            <div className="text-xs text-ink/40">
                              Expires: {new Date(item.licenseExpiry).toLocaleDateString('en-GB')}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="h-4 w-4 text-ink/30" />
                            <span className="font-medium text-ink">{item.title || item.id}</span>
                          </div>
                          <div className="text-sm text-ink/60 mb-2">
                            {item.destination?.name} · {item.areaSqm ? `${item.areaSqm} sqm` : ''}
                          </div>
                          <div className="text-xs text-ink/40">
                            Title Status: <span className="font-mono uppercase">{item.titleStatus}</span>
                          </div>
                        </>
                      )}
                      <div className="text-xs text-ink/30 mt-2">
                        Submitted {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className="flex items-center gap-1 px-2 py-1 bg-ochre/10 text-ochre border border-ochre/20 rounded-sm text-[11px] font-mono uppercase">
                        <Clock className="h-3 w-3" /> Pending
                      </span>
                      <button className="p-2 rounded-sm bg-sage/10 text-sage border border-sage/20 hover:bg-sage/20 transition-colors" title="Approve">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button className="p-2 rounded-sm bg-laterite/10 text-laterite border border-laterite/20 hover:bg-laterite/20 transition-colors" title="Reject">
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
