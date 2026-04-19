'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, CheckCircle, XCircle, Eye, Home, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: 'bg-sage/10 text-sage border border-sage/20',
  DRAFT: 'bg-ochre/10 text-ochre border border-ochre/20',
  UNDER_OFFER: 'bg-ocean/10 text-ocean border border-ocean/20',
  SOLD: 'bg-ink/10 text-ink/50 border border-ink/20',
  WITHDRAWN: 'bg-laterite/10 text-laterite border border-laterite/20',
};

export default function AdminListingsPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

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
    const fetchListings = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(search && { search }),
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        });
        const res = await fetch(`/api/admin/listings?${params}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [userId, isAdmin, page, search, statusFilter]);

  if (!isLoaded || !user) return (
    <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>
  );
  if (!isAdmin) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatPrice = (kobo: number) => {
    if (!kobo) return '—';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(kobo / 100);
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-6xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">
              Listings Moderation
            </h1>
            <p className="text-ink/60 text-[16px]">Review, approve, and moderate all property listings on the platform</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <input
                type="text"
                placeholder="Search by title or location..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft (Pending Review)</option>
              <option value="ACTIVE">Active</option>
              <option value="UNDER_OFFER">Under Offer</option>
              <option value="SOLD">Sold</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-ink/10">
              <span className="text-sm text-ink/60">{total} listing{total !== 1 ? 's' : ''} found</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-ink/40 text-sm">Loading listings...</div>
            ) : listings.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">No listings match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-paper/50">
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Listing</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Agent</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Price</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Status</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Listed</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {listings.map((l: any) => (
                      <tr key={l.id} className="hover:bg-paper/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <Home className="h-4 w-4 text-ink/20 mt-0.5 shrink-0" />
                            <div>
                              <div className="font-medium text-ink">{l.property?.title || 'Untitled'}</div>
                              <div className="text-ink/50 text-xs flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {l.property?.destination?.name || l.property?.location || '—'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-ink/70">{l.owner?.profile?.firstName} {l.owner?.profile?.lastName}</div>
                          <div className="text-ink/40 text-xs">{l.owner?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm text-ink">
                          {formatPrice(l.priceKobo)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${STATUS_COLOURS[l.status] || 'bg-ink/10 text-ink/50'}`}>
                            {l.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink/50 text-xs">
                          {new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/properties/${l.id}`} className="p-1.5 rounded-sm border border-ink/15 hover:bg-paper transition-colors" title="View listing">
                              <Eye className="h-3.5 w-3.5 text-ink/40" />
                            </Link>
                            {l.status === 'DRAFT' && (
                              <>
                                <button className="p-1.5 rounded-sm border border-sage/20 bg-sage/10 hover:bg-sage/20 transition-colors" title="Approve">
                                  <CheckCircle className="h-3.5 w-3.5 text-sage" />
                                </button>
                                <button className="p-1.5 rounded-sm border border-laterite/20 bg-laterite/10 hover:bg-laterite/20 transition-colors" title="Reject">
                                  <XCircle className="h-3.5 w-3.5 text-laterite" />
                                </button>
                              </>
                            )}
                          </div>
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
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper transition-colors">
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
