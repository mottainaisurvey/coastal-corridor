'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, MessageSquare, Scale } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

const PRIORITY_COLOURS: Record<string, string> = {
  HIGH: 'bg-laterite/10 text-laterite border border-laterite/20',
  MEDIUM: 'bg-ochre/10 text-ochre border border-ochre/20',
  LOW: 'bg-ocean/10 text-ocean border border-ocean/20',
};

export default function AdminDisputesPage() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [stats, setStats] = useState({ open: 0, resolved: 0, avgDays: 0 });

  // Use sessionClaims (JWT, available immediately) with fallback to publicMetadata
  const role = ((sessionClaims?.publicMetadata as any)?.role as string) || (user?.publicMetadata?.role as string) || '';
  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isAdmin) router.replace('/unauthorized?required=admin');
  }, [metadataLoaded, isAdmin, router]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const fetchDisputes = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ ...(filter !== 'ALL' && { status: filter }) });
        const res = await fetch(`/api/admin/disputes?${params}`);
        if (res.ok) {
          const data = await res.json();
          setDisputes(data.data || []);
          if (data.stats) setStats(data.stats);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchDisputes();
  }, [userId, isAdmin, filter]);

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (metadataLoaded && !isAdmin) {
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

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Disputes</h1>
            <p className="text-ink/60 text-[16px]">Manage transaction disputes, buyer-seller conflicts, and resolution workflows</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Open Disputes</div>
              <div className="font-serif text-[28px] font-medium text-laterite">{stats.open}</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Resolved (30d)</div>
              <div className="font-serif text-[28px] font-medium text-sage">{stats.resolved}</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
              <div className="eyebrow mb-2">Avg Resolution</div>
              <div className="font-serif text-[28px] font-medium text-ocean">{stats.avgDays}d</div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 mb-6 bg-white border border-ink/10 rounded-lg p-1 w-fit">
            {['ALL', 'OPEN', 'UNDER_REVIEW', 'RESOLVED'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-md text-xs font-mono uppercase tracking-wider transition-colors ${filter === f ? 'bg-ink text-paper' : 'text-ink/50 hover:text-ink'}`}>
                {f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Disputes list */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white border border-ink/10 rounded-lg p-8 text-center text-ink/40 text-sm">Loading disputes...</div>
            ) : disputes.length === 0 ? (
              <div className="bg-white border border-ink/10 rounded-lg p-8 text-center">
                <Scale className="h-10 w-10 text-sage/40 mx-auto mb-3" />
                <p className="text-ink/50 text-sm">No disputes found for the selected filter.</p>
              </div>
            ) : (
              disputes.map((d: any) => (
                <div key={d.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="h-4 w-4 text-laterite/60" />
                        <span className="font-medium text-ink">{d.title || `Dispute #${d.id.slice(-6)}`}</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${PRIORITY_COLOURS[d.priority] || 'bg-ink/10 text-ink/50'}`}>
                          {d.priority || 'MEDIUM'}
                        </span>
                      </div>
                      <p className="text-sm text-ink/60 mb-3 line-clamp-2">{d.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-4 text-xs text-ink/40">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Transaction: {d.transaction?.reference || '—'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Opened {new Date(d.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`px-2 py-1 rounded-sm text-[11px] font-mono uppercase ${
                        d.status === 'RESOLVED' ? 'bg-sage/10 text-sage border border-sage/20' :
                        d.status === 'UNDER_REVIEW' ? 'bg-ochre/10 text-ochre border border-ochre/20' :
                        'bg-laterite/10 text-laterite border border-laterite/20'
                      }`}>
                        {d.status?.replace('_', ' ') || 'OPEN'}
                      </span>
                      {d.status !== 'RESOLVED' && (
                        <button className="p-2 rounded-sm bg-sage/10 text-sage border border-sage/20 hover:bg-sage/20 transition-colors" title="Mark resolved">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Guidance note */}
          <div className="mt-8 p-5 bg-laterite/5 border border-laterite/15 rounded-lg">
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-laterite/60 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-ink text-sm mb-1">Dispute Resolution Protocol</div>
                <p className="text-xs text-ink/60 leading-relaxed">
                  All disputes involving transactions above ₦5,000,000 must be escalated to legal counsel within 48 hours.
                  Disputes involving title defects require ESVARBON notification. Document all resolution steps in the audit log.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
