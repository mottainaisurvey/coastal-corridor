'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Phone, Mail, Clock, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';

const AGENT_ROLES = ['agent', 'admin', 'superadmin', 'AGENT', 'ADMIN', 'SUPERADMIN'];

const STATUS_COLOURS: Record<string, string> = {
  NEW: 'bg-ocean/10 text-ocean border border-ocean/20',
  CONTACTED: 'bg-ochre/10 text-ochre border border-ochre/20',
  QUALIFIED: 'bg-sage/10 text-sage border border-sage/20',
  CLOSED: 'bg-ink/10 text-ink/50 border border-ink/20',
  LOST: 'bg-laterite/10 text-laterite border border-laterite/20',
};

export default function AgentInquiriesPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const role = (user?.publicMetadata?.role as string) || '';
  const isAgent = AGENT_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isAgent) router.replace('/unauthorized?required=agent');
  }, [isLoaded, user, isAgent, router]);

  useEffect(() => {
    if (!userId || !isAgent) return;
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page), limit: String(PAGE_SIZE),
          ...(search && { search }),
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        });
        const res = await fetch(`/api/agent/inquiries?${params}`);
        if (res.ok) {
          const data = await res.json();
          setInquiries(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchInquiries();
  }, [userId, isAgent, page, search, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/agent/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i));
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isAgent) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <Link href="/agent/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Agent Portal</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Inquiries</h1>
            <p className="text-ink/60 text-[16px]">Manage buyer inquiries and track your lead pipeline</p>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {['ALL', 'NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED'].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-2.5 rounded-sm border text-xs font-mono uppercase tracking-wider transition-colors ${statusFilter === s ? 'bg-ink text-paper border-ink' : 'bg-white border-ink/15 text-ink/50 hover:border-ink/30'}`}>
                {s === 'ALL' ? 'All' : s}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
            <input type="text" placeholder="Search by buyer name, email, or property..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10" />
          </div>

          {/* Inquiries list */}
          <div className="space-y-3">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-5 animate-pulse">
                  <div className="h-4 bg-ink/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-ink/5 rounded w-1/2" />
                </div>
              ))
            ) : inquiries.length === 0 ? (
              <div className="bg-white border border-ink/10 rounded-lg p-12 text-center">
                <MessageSquare className="h-8 w-8 text-ink/20 mx-auto mb-3" />
                <div className="text-ink/40 text-sm">No inquiries found</div>
              </div>
            ) : (
              inquiries.map((inq: any) => (
                <div key={inq.id} className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-ink">{inq.buyerName || 'Anonymous Buyer'}</span>
                        <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${STATUS_COLOURS[inq.status] || 'bg-ink/10 text-ink/50'}`}>
                          {inq.status}
                        </span>
                      </div>
                      <div className="text-sm text-ink/60 mb-2 truncate">{inq.listing?.title || 'General Inquiry'}</div>
                      {inq.message && (
                        <p className="text-sm text-ink/50 line-clamp-2 mb-3">{inq.message}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-ink/40">
                        {inq.buyerEmail && (
                          <a href={`mailto:${inq.buyerEmail}`} className="flex items-center gap-1 hover:text-ocean transition-colors">
                            <Mail className="h-3.5 w-3.5" /> {inq.buyerEmail}
                          </a>
                        )}
                        {inq.buyerPhone && (
                          <a href={`tel:${inq.buyerPhone}`} className="flex items-center gap-1 hover:text-ocean transition-colors">
                            <Phone className="h-3.5 w-3.5" /> {inq.buyerPhone}
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2">
                      <select
                        value={inq.status}
                        onChange={e => updateStatus(inq.id, e.target.value)}
                        disabled={updating === inq.id}
                        className="px-2 py-1.5 bg-paper border border-ink/15 rounded-sm text-xs focus:outline-none focus:border-ocean/50 disabled:opacity-50"
                      >
                        {['NEW', 'CONTACTED', 'QUALIFIED', 'CLOSED', 'LOST'].map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <span className="text-xs text-ink/40">Page {page} of {totalPages} · {total} inquiries</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-white">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-white">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
